using System.Threading.Tasks;
using Pulumi;
using Pulumi.AzureNative.Resources;
using Pulumi.AzureNative.Storage;
using Pulumi.AzureNative.Network;
using Pulumi.AzureNative.Compute;

class MyStack : Stack
{
    public MyStack()
    {
        // Create an Azure Resource Group
        var resourceGroup = new ResourceGroup("gp-pulumi-example-rg");

        // Create an Azure resource (Storage Account)
        var storageAccount = new StorageAccount("pulumiexamplesa", new StorageAccountArgs
        {
            ResourceGroupName = resourceGroup.Name,
            Sku = new Pulumi.AzureNative.Storage.Inputs.SkuArgs
            {
                Name = Pulumi.AzureNative.Storage.SkuName.Standard_LRS
            },
            Kind = Kind.StorageV2
        });

        var publicIPAddress = new PublicIPAddress("pulumiExamplePublicIPAddress", new PublicIPAddressArgs
        {
            ResourceGroupName = resourceGroup.Name,
            DnsSettings = new Pulumi.AzureNative.Network.Inputs.PublicIPAddressDnsSettingsArgs
            {
                DomainNameLabel = "pulumi-example-vm"
            },
            PublicIPAllocationMethod = "Dynamic",
            PublicIpAddressName = "pulumiExampleIP",
            Sku = new Pulumi.AzureNative.Network.Inputs.PublicIPAddressSkuArgs
            {
                Name = "Basic"
            }
        });

        var networkSecurityGroup = new NetworkSecurityGroup("pulumiExampleSecurityGroup", new NetworkSecurityGroupArgs
        {
            ResourceGroupName = resourceGroup.Name,
            SecurityRules =
                {
                    new Pulumi.AzureNative.Network.Inputs.SecurityRuleArgs
                    {
                         Access = "Allow",
                         DestinationAddressPrefix = "*",
                         DestinationPortRange = "3389",
                         Direction = "Inbound",
                         Name = "default-allow-3389",
                         Priority = 1000,
                         Protocol = "Tcp",
                         SourceAddressPrefix = "*",
                         SourcePortRange = "*"
                    }
                }
        });

        var virtualNetwork = new VirtualNetwork("pulumiExampleNetwork", new VirtualNetworkArgs
        {
            ResourceGroupName = resourceGroup.Name,
            AddressSpace = new Pulumi.AzureNative.Network.Inputs.AddressSpaceArgs
            {
                AddressPrefixes =
                    {
                        "10.0.0.0/16"
                    }
            }
        });

        var subnet = new Pulumi.AzureNative.Network.Subnet("pulumiExampleSubnet", new SubnetArgs
        {
            ResourceGroupName = resourceGroup.Name,
            VirtualNetworkName = virtualNetwork.Name,
            AddressPrefix = "10.0.0.0/24",
            NetworkSecurityGroup = new Pulumi.AzureNative.Network.Inputs.NetworkSecurityGroupArgs
            {
                Id = networkSecurityGroup.Id
            }
        });

        var networkInterface = new NetworkInterface("pulumiExampleNetworkInterface", new NetworkInterfaceArgs
        {
            ResourceGroupName = resourceGroup.Name,
            IpConfigurations = new Pulumi.AzureNative.Network.Inputs.NetworkInterfaceIPConfigurationArgs
            {
                Name = "pulumiexampleipconfig",
                PrivateIPAllocationMethod = "Dynamic",
                PublicIPAddress = new Pulumi.AzureNative.Network.Inputs.PublicIPAddressArgs
                {
                    Id = publicIPAddress.Id
                },
                Subnet = new Pulumi.AzureNative.Network.Inputs.SubnetArgs
                {
                    Id = subnet.Id
                }
            }
        });

        var virtualMachine = new VirtualMachine("pulumiExampleVM", new VirtualMachineArgs
        {
            DiagnosticsProfile = new Pulumi.AzureNative.Compute.Inputs.DiagnosticsProfileArgs
            {
                BootDiagnostics = new Pulumi.AzureNative.Compute.Inputs.BootDiagnosticsArgs
                {
                    Enabled = true
                }
            },
            HardwareProfile = new Pulumi.AzureNative.Compute.Inputs.HardwareProfileArgs
            {
                VmSize = "Standard_D2s_v3"
            },
            ResourceGroupName = resourceGroup.Name,
            NetworkProfile = new Pulumi.AzureNative.Compute.Inputs.NetworkProfileArgs
            {
                NetworkInterfaces = new Pulumi.AzureNative.Compute.Inputs.NetworkInterfaceReferenceArgs
                {
                    Id = networkInterface.Id
                }
            },
            OsProfile = new Pulumi.AzureNative.Compute.Inputs.OSProfileArgs
            {
                AdminUsername = "exampleadminuser",
                AdminPassword = "Password@1",
                ComputerName = "pulumiExampleVM"
            },
            StorageProfile = new Pulumi.AzureNative.Compute.Inputs.StorageProfileArgs
            {
                DataDisks = new Pulumi.AzureNative.Compute.Inputs.DataDiskArgs
                {
                    CreateOption = "empty",
                    DiskSizeGB = 1023,
                    Lun = 0
                },
                ImageReference = new Pulumi.AzureNative.Compute.Inputs.ImageReferenceArgs
                {
                    Offer = "WindowsServer",
                    Publisher = "MicrosoftWindowsServer",
                    Sku = "2019-datacenter-gensecond",
                    Version = "latest"
                },
                OsDisk = new Pulumi.AzureNative.Compute.Inputs.OSDiskArgs
                {
                    CreateOption = DiskCreateOptionTypes.FromImage,
                    ManagedDisk = new Pulumi.AzureNative.Compute.Inputs.ManagedDiskParametersArgs
                    {
                        StorageAccountType = "StandardSSD_LRS"
                    }
                }
            }
        });
    }
}
