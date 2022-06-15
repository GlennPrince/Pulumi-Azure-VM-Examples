import * as resources from "@pulumi/azure-native/resources";
import * as storage from "@pulumi/azure-native/storage";
import * as network from "@pulumi/azure-native/network";
import * as compute from "@pulumi/azure-native/compute";

/** 
    Create an Azure Resource Group
*/
const resourceGroup = new resources.ResourceGroup("gp-pulumi-example-rg");

/**
    Create an Azure resource (Storage Account)
*/
const storageAccount = new storage.StorageAccount("pulumiexamplesa", {
    resourceGroupName: resourceGroup.name,
    sku: {
        name: storage.SkuName.Standard_LRS,
    },
    kind: storage.Kind.StorageV2,
});

/** 
    Create an Azure Public IP
*/
const publicIPAddress = new network.PublicIPAddress("pulumiExamplePublicIPAddress", {
    dnsSettings: {
        domainNameLabel: "pulumi-example-vm",
    },
    location: "eastus",
    publicIPAllocationMethod: network.IPAllocationMethod.Dynamic,
    publicIpAddressName: "pulumiExampleIP",
    resourceGroupName: resourceGroup.name,
    sku: {
        name: "Basic",
    },
});

/** 
    Create an Azure Security Group
*/
const networkSecurityGroup = new network.NetworkSecurityGroup("pulumiExampleSecurityGroup", {
    location: "eastus",
    resourceGroupName: resourceGroup.name,
    securityRules: [{
        access: "Allow",
        destinationAddressPrefix: "*",
        destinationPortRange: "3389",
        direction: "Inbound",
        name: "default-allow-3389",
        priority: 1000,
        protocol: "Tcp",
        sourceAddressPrefix: "*",
        sourcePortRange: "*",
    }]
});

/** 
    Create an Azure Virtual Network
*/

const virtualNetwork = new network.VirtualNetwork("pulumiExampleNetwork", {
    addressSpace: {
        addressPrefixes: ["10.0.0.0/16"],
    },
    location: "eastus",
    resourceGroupName: resourceGroup.name,
    subnets: [{
        addressPrefix: "10.0.0.0/24",
        name: "pulumiExampleSubnet",
        networkSecurityGroup: {
            id: networkSecurityGroup.id,
        },
    }],
});

const subnet = virtualNetwork.subnets.apply(subnet => subnet![0])

/** 
    Create an Azure Virtual Network Interface
*/
const networkInterface = new network.NetworkInterface("pulumiExampleNetworkInterface", {
    ipConfigurations: [{
        name: "pulumiexampleipconfig",
        privateIPAllocationMethod: "Dynamic",
        publicIPAddress: {
            id: publicIPAddress.id,
        },
        subnet: subnet
    }],
    location: "eastus",
    resourceGroupName: resourceGroup.name,
}, {
    dependsOn: [
        publicIPAddress,
        virtualNetwork,
    ],
});

/** 
    Create an Azure Virtual Machine
*/

const virtualMachine = new compute.VirtualMachine("pulumiExampleVM", {
    diagnosticsProfile: {
        bootDiagnostics: {
            enabled: true
        },
    },
    hardwareProfile: {
        vmSize: compute.VirtualMachineSizeTypes.Standard_D2s_v3,
    },
    location: "eastus",
    resourceGroupName: resourceGroup.name,
    networkProfile: {
        networkInterfaces: [{
            id: networkInterface.id,
        }],
    },
    osProfile: {
        adminPassword: "Password@1",
        adminUsername: "exampleadminuser",
        computerName: "pulumiExampleVM",
    },
    storageProfile: {
        dataDisks: [{
            createOption: "Empty",
            diskSizeGB: 1023,
            lun: 0,
        }],
        imageReference: {
            offer: "WindowsServer",
            publisher: "MicrosoftWindowsServer",
            sku: "2019-datacenter-gensecond",
            version: "latest",
        },
        osDisk: {
            createOption: compute.DiskCreateOption.FromImage,
            managedDisk: {
                storageAccountType: "StandardSSD_LRS",
            },
        },
    },
});